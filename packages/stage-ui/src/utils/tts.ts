import type { ReaderLike } from 'clustr'

import { readGraphemeClusters } from 'clustr'

const keptPunctuations = new Set('?？!！')
const hardPunctuations = new Set('.。?？!！…⋯～~「」\n\t\r')
const softPunctuations = new Set(',，、–—:：;；《》')

export interface TTSInputChunk {
  text: string
  words: number
  reason: 'boost' | 'limit' | 'hard' | 'flush'
}

export interface TTSInputChunkOptions {
  boost?: number
  minimumWords?: number
  maximumWords?: number
}

/**
 * Processes the input string or UTF-8 byte stream reader into chunks suitable for TTS synthesis.
 *
 * @param input A string or a ReaderLike object that reads from an underlying UTF-8 byte stream.
 * @param options
 * @param options.boost Specifies the number of chunks to yield using greedier rules. This may help
 *                      reduce the initial delay when processing long input text.
 * @param options.minimumWords Minimum number of words in a chunk.
 * @param options.maximumWords Maximum number of words in a chunk.
 */
export async function* chunkTTSInput(input: string | ReaderLike, options?: TTSInputChunkOptions): AsyncGenerator<TTSInputChunk, void, unknown> {
  const {
    boost = 2,
    minimumWords = 4,
    maximumWords = 12,
  } = options ?? {}

  const iterator = readGraphemeClusters(
    typeof input === 'string'
      ? new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(input))
            controller.close()
          },
        }).getReader()
      : input,
  )

  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' }) // I love Intl.Segmenter

  let yieldCount = 0
  let buffer = ''
  let chunk = ''
  let chunkWordsCount = 0

  let previousValue: string | undefined
  let current = await iterator.next()

  while (!current.done) {
    const value = current.value

    if (value.length > 1) {
      previousValue = value
      current = await iterator.next()
      continue
    }

    const hard = hardPunctuations.has(value)
    const soft = softPunctuations.has(value)
    const kept = keptPunctuations.has(value)

    if (hard || soft) {
      switch (value) {
        case '.':
        case ',': {
          if (previousValue !== undefined && /\d/.test(previousValue)) {
            const next = await iterator.next()
            if (!next.done && next.value && /\d/.test(next.value)) {
              // This dot could be a decimal point, so we skip it
              previousValue = next.value
              current = next
              continue
            }
          }
        }
      }

      if (buffer.length === 0) {
        previousValue = value
        current = await iterator.next()
        continue
      }

      const words = [...segmenter.segment(buffer)].filter(w => w.isWordLike)

      if (chunkWordsCount > minimumWords && chunkWordsCount + words.length > maximumWords) {
        const text = kept ? chunk.trim() + value : chunk.trim()
        yield {
          text,
          words: chunkWordsCount,
          reason: 'limit',
        }
        yieldCount++
        chunk = ''
        chunkWordsCount = 0
      }

      chunk += buffer + value
      chunkWordsCount += words.length
      buffer = ''

      if (hard || chunkWordsCount > maximumWords || yieldCount < boost) {
        const text = chunk.trim()
        yield {
          text,
          words: chunkWordsCount,
          reason: hard ? 'hard' : chunkWordsCount > maximumWords ? 'limit' : 'boost',
        }
        yieldCount++
        chunk = ''
        chunkWordsCount = 0
      }

      previousValue = value
      current = await iterator.next()
      continue
    }

    buffer += value
    previousValue = value
    current = await iterator.next()
  }

  if (chunk.length > 0 || buffer.length > 0) {
    const text = (chunk + buffer).trim()
    yield {
      text,
      words: chunkWordsCount + [...segmenter.segment(buffer)].filter(w => w.isWordLike).length,
      reason: 'flush',
    }
  }
}
