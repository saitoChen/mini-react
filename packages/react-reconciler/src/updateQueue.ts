/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-03 10:45:56
 * @Description:
 */
import { Dispatch } from 'react/src/currentDispatcher'
import { Action } from 'shared/ReactTypes'
import { Lane } from './fiberLanes'

export interface Update<State> {
	action: Action<State>
	lane: Lane
	next: Update<any> | null
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null
	}
	dispatch: Dispatch<State> | null
}

export const createUpdate = <State>(
	action: Action<State>,
	lane: Lane
): Update<State> => {
	return {
		action,
		lane,
		next: null
	}
}

export const createUpdateQueue = <State>(): UpdateQueue<State> => {
	return {
		shared: {
			pending: null
		},
		dispatch: null
	}
}

export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>
) => {
	const pending = updateQueue.shared.pending
	if (pending === null) {
		// pending = a -> a
		update.next = update
	} else {
		// b.next = a.next (a)
		update.next = pending.next
		// a.next = b
		pending.next = update
		// pending = b -> a -> b
	}
	updateQueue.shared.pending = update // last update
	// updateQueue.shared.pending.next is the first update
}

// consume update
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null,
	renderLane: Lane
): { memorizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memorizedState: baseState
	}
	if (pendingUpdate !== null) {
		// first update
		const first = pendingUpdate.next
		let pending = pendingUpdate.next as Update<any>
		do {
			const updateLane = pending.lane
			if (updateLane === renderLane) {
				const action = pendingUpdate.action
				if (action instanceof Function) {
					baseState = action(baseState)
				} else {
					baseState = action
				}
			} else {
				if (__DEV__) {
					console.error('processUpdateQueue has an error')
				}
			}
			pending = pending?.next as Update<any>
		} while (pending !== first)
	}
	result.memorizedState = baseState
	return result
}
