<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

let observer: IntersectionObserver | null = null
let mutObs: MutationObserver | null = null

// Global scroll reveal observer
onMounted(() => {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  )
  observer = revealObserver

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el))

  // Re-observe on route change
  mutObs = new MutationObserver(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach((el) => revealObserver.observe(el))
  })
  mutObs.observe(document.body, { childList: true, subtree: true })
})

onUnmounted(() => {
  observer?.disconnect()
  mutObs?.disconnect()
})
</script>
