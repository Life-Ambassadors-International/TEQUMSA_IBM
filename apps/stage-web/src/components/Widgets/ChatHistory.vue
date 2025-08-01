<script setup lang="ts">
import { useMarkdown } from '@proj-airi/stage-ui/composables'
import { useChatStore } from '@proj-airi/stage-ui/stores'
import { storeToRefs } from 'pinia'
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const chatHistoryRef = ref<HTMLDivElement>()

const { t } = useI18n()
const { messages, sending } = storeToRefs(useChatStore())

const { process } = useMarkdown()
const { onBeforeMessageComposed, onTokenLiteral } = useChatStore()

onBeforeMessageComposed(async () => {
  // Scroll down to the new sent message
  nextTick().then(() => {
    if (!chatHistoryRef.value)
      return

    chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
  })
})

onTokenLiteral(async () => {
  // Scroll down to the new responding message
  nextTick().then(() => {
    if (!chatHistoryRef.value)
      return

    chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight
  })
})
</script>

<template>
  <div relative px="<sm:2" py="<sm:2" flex="~ col" rounded="lg" overflow-hidden>
    <div flex-1 /> <!-- spacer -->
    <div ref="chatHistoryRef" v-auto-animate h-full w-full flex="~ col" overflow-scroll>
      <div flex-1 /> <!-- spacer -->
      <div v-for="(message, index) in messages" :key="index" mb-2>
        <div v-if="message.role === 'error'" flex mr="12">
          <div
            flex="~ col" border="2 solid violet-200/50 dark:violet-500/50" shadow="md violet-200/50 dark:none"
            min-w-20 rounded-lg px-2 py-1 h="unset <sm:fit" bg="<md:violet-500/25"
          >
            <div flex="~ row" gap-2>
              <div flex-1>
                <span text-xs text="violet-400/90 dark:violet-600/90" font-normal class="inline <sm:hidden">{{ t('stage.chat.message.character-name.core-system') }}</span>
              </div>
              <div i-solar:danger-triangle-bold-duotone text-violet-500 />
            </div>
            <div v-if="sending && index === messages.length - 1" i-eos-icons:three-dots-loading />
            <div
              v-else class="markdown-content break-words text-violet-500" text="base <sm:xs"
              v-html="process(message.content as string)"
            />
          </div>
        </div>
        <div v-if="message.role === 'assistant'" flex mr="12">
          <div
            flex="~ col" border="2 solid primary-200/50 dark:primary-500/50" shadow="md primary-200/50 dark:none" min-w-20
            rounded-lg px-2 py-1 h="unset <sm:fit" bg="<md:primary-500/25"
          >
            <div>
              <span text-xs text="primary-400/90 dark:primary-600/90" font-normal class="inline <sm:hidden">{{ t('stage.chat.message.character-name.airi') }}</span>
            </div>
            <div v-if="message.content && index === messages.length - 1" class="markdown-content" text="xs primary-400">
              <div v-for="(slice, sliceIndex) in message.slices" :key="sliceIndex">
                <div v-if="slice.type === 'tool-call'">
                  <div
                    p="1" border="1 solid primary-200" rounded-lg m="y-1" bg="primary-100"
                  >
                    Called: <code>{{ slice.toolCall.toolName }}</code>
                  </div>
                </div>
                <div v-else-if="slice.type === 'tool-call-result'" /> <!-- this line should be unreachable -->
                <div v-else v-html="process(slice.text)" />
              </div>
            </div>
            <div v-else i-eos-icons:three-dots-loading />
          </div>
        </div>
        <div v-else-if="message.role === 'user'" flex="~ row-reverse" ml="12">
          <div
            flex="~ col" border="2 solid cyan-200/50 dark:cyan-500/50" shadow="md cyan-200/50 dark:none" px="2"
            h="unset <sm:fit" min-w-20 rounded-lg px-2 py-1 bg="<md:cyan-500/25"
          >
            <div>
              <span text-xs text="cyan-400/90 dark:cyan-600/90" font-normal class="inline <sm:hidden">{{ t('stage.chat.message.character-name.you') }}</span>
            </div>
            <div v-if="message.content" class="markdown-content break-words" text="base <sm:xs" v-html="process(message.content as string)" />
            <div v-else />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
