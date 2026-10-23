import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 角色在水面上的落点与朝向，刷新后据此恢复现场。 */
export interface CharacterPose {
  x: number
  z: number
  yaw: number
}

/** 场景页的跨刷新状态：目前只保存角色的位置，避免每次都从头跑。 */
export const useSiteSceneStore = defineStore(
  'site-scene',
  () => {
    const characterPose = ref<CharacterPose | null>(null)

    function saveCharacterPose(pose: CharacterPose): void {
      characterPose.value = pose
    }

    return { characterPose, saveCharacterPose }
  },
  {
    persist: {
      key: 'site-scene',
      storage: localStorage,
      pick: ['characterPose']
    }
  }
)
