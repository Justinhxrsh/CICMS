<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style>
/* Global styles for Delaford */
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #000;
  color: #fff;
  overflow: hidden;
  user-select: none;
}

#app {
  height: 100vh;
}

/* Reset buttons and inputs */
button, input {
  font-family: inherit;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.2);
}

::-webkit-scrollbar-thumb {
  background: rgba(255,200,50,0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255,200,50,0.5);
}
</style>
