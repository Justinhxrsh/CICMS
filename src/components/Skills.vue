<template>
  <div class="skills">
    <div v-for="(xp, skill) in skills" :key="skill" class="skill-row">
      <div class="skill-info">
        <span class="skill-name">{{ capitalize(skill) }}</span>
        <span class="skill-level">Lvl {{ getLevel(xp) }}</span>
      </div>
      <div class="xp-bar-container">
        <div class="xp-bar" :style="{ width: getPercent(xp) + '%' }"></div>
        <div class="xp-text">{{ xp }} / {{ getNextLevelXP(xp) }} XP</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'Skills',
  computed: {
    ...mapState('player', ['skills']),
  },
  methods: {
    capitalize(s) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    getLevel(xp) {
      return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
    },
    getNextLevelXP(xp) {
      const level = this.getLevel(xp);
      return Math.pow(level, 2) * 100;
    },
    getPercent(xp) {
      const level = this.getLevel(xp);
      const currentLevelXP = Math.pow(level - 1, 2) * 100;
      const nextLevelXP = Math.pow(level, 2) * 100;
      const range = nextLevelXP - currentLevelXP;
      const progress = xp - currentLevelXP;
      return (progress / range) * 100;
    },
  },
};
</script>

<style scoped>
.skills {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skill-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
}

.skill-name {
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.skill-level {
  color: #f5d44a;
}

.xp-bar-container {
  height: 12px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.xp-bar {
  height: 100%;
  background: linear-gradient(to right, #7b4fb6, #9b6fd6);
  transition: width 0.5s ease-out;
}

.xp-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  color: white;
  text-shadow: 0 1px 1px #000;
  pointer-events: none;
}
</style>
