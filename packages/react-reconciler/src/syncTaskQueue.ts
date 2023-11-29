/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-27 21:42:25
 * @Description:
 */
let syncQueue: ((...args: any) => void)[] | null = null
let isFlushingSyncQueue = false
export const scheduleSyncCallback = (
	callback: (...args: any) => void
): void => {
	if (syncQueue === null) {
		syncQueue = [callback]
	} else {
		syncQueue.push(callback)
	}
}

export const flushSyncCallbacks = () => {
	if (!isFlushingSyncQueue && syncQueue) {
		isFlushingSyncQueue = true
		try {
			syncQueue.forEach((cb) => cb())
		} catch (e) {
			if (__DEV__) {
				console.warn('flushSyncQueus has error')
			}
		} finally {
			isFlushingSyncQueue = false
			syncQueue = null
		}
	}
}
