<template>
  <div class="circle-progress">
    <svg :width="size" :height="size" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- 底色圆环 -->
      <circle class="background-circle" cx="50" cy="50" :r="radius" fill="none" stroke="#e0e0e0"
        :stroke-width="strokeWidth" />
      <!-- 进度圆环，最少显示 %5 给人希望 -->
      <circle class="progress-circle" cx="50" cy="50" :r="radius" fill="none" stroke="#007bff"
        :stroke-width="strokeWidth" :stroke-dasharray="dashArray"
        :stroke-dashoffset="dashOffset < dashArray * 0.05 ? dashArray * 0.05 : dashOffset" />
    </svg>
    <!-- 中间显示的百分比 -->
    <!-- <div class="percentage">{{ percentageText }}</div> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
  name: "CircleProgress",
  props: {
    // 百分比，范围为 0-1
    percent: {
      type: Number,
      required: true,
      validator: (value: number) => value >= 0 && value <= 1,
    },
    // 圆环大小，默认 100px
    size: {
      type: Number,
      default: 14,
    },
    // 圆环宽度，默认 8px
    strokeWidth: {
      type: Number,
      default: 10,
    },
  },
  setup(props) {
    // 计算圆环半径
    const radius = computed(() => props.size * 2 + props.strokeWidth);

    // 计算圆周长
    const dashArray = computed(() => 2 * Math.PI * radius.value);

    // 根据百分比计算偏移量
    const dashOffset = computed(() => dashArray.value * (1 - props.percent));

    // 格式化百分比文本
    const percentageText = computed(() => `${Math.round(props.percent * 100)}%`);

    return {
      radius,
      dashArray,
      dashOffset,
      percentageText,
    };
  },
});
</script>

<style scoped>
.circle-progress {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.1px;
}

svg {
  transform: rotate(-90deg);
  /* 让起始点从顶部开始 */
  transform-origin: center;
}

.background-circle {
  stroke: #e0e0e0;
  /* 淡色底色 */
}

.progress-circle {
  stroke: #007bff;
  /* 蓝色进度条 */
  transition: stroke-dashoffset 0.3s ease;
  /* 添加过渡效果 */
}

.percentage {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
</style>