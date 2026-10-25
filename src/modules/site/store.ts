import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 角色在水面上的落点与朝向，刷新后据此恢复现场。 */
export interface CharacterPose {
  x: number
  z: number
  yaw: number
}

/** 上次离开飞行相机时的位置与朝向；默认相机不使用这份状态。 */
export interface SceneCameraPose {
  x: number
  y: number
  z: number
  yaw: number
  pitch: number
  targetX: number
  targetY: number
  targetZ: number
  distance: number
  fly: 'mc' | 'maya'
}

/** 场景页的跨刷新状态：角色落点与飞行相机位置。 */
export const useSiteSceneStore = defineStore(
  'site-scene',
  () => {
    const characterPose = ref<CharacterPose | null>(null)
    const cameraPose = ref<SceneCameraPose | null>(null)

    function saveCharacterPose(pose: CharacterPose): void {
      characterPose.value = pose
    }

    function saveCameraPose(pose: SceneCameraPose): void {
      cameraPose.value = pose
    }

    return { characterPose, cameraPose, saveCharacterPose, saveCameraPose }
  },
  {
    persist: {
      key: 'site-scene',
      storage: localStorage,
      pick: ['characterPose', 'cameraPose']
    }
  }
)
