import { FiberRootNode } from './fiber'

/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-26 23:44:13
 * @Description:
 */
export type Lane = number
export type Lanes = number

export const SyncLane = 0b0001
export const NoLane = 0b0000
export const NoLanes = 0b0000

export const mergeLanes = (laneA: Lane, laneB: Lane): Lanes => {
	return laneA | laneB
}

export const requestUpdateLane = () => {
	return SyncLane
}

export const getHighestPriorityLane = (lanes: Lanes): Lane => {
	return lanes & -lanes
}

export const markRootFinished = (root: FiberRootNode, lane: Lane) => {
	root.pendingLanes &= ~lane
}
