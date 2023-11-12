/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-03 10:45:56
 * @Description:
 */
import { Dispatch } from 'react/src/currentDispatcher'
import { Action } from 'shared/ReactTypes'

export interface Update<State> {
	action: Action<State>
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null
	}
	dispatch: Dispatch<State> | null
}

export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return {
		action
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
	updateQueue.shared.pending = update
}

// consume update
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memorizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memorizedState: baseState
	}
	if (pendingUpdate !== null) {
		const action = pendingUpdate.action
		if (typeof action === 'function') {
			result.memorizedState = (action as (prevState: State) => State)(baseState)
		} else {
			result.memorizedState = action
		}
	}

	return result
}
