/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-10-30 15:34:42
 * @Description: react entry
 */
import {
	Dispatcher,
	resolveDispatcher,
	currentDispatcher
} from './src/currentDispatcher'
import { jsx, isValidElement as isValidElementFn } from './src/jsx'

export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher()
	return dispatcher.useState(initialState)
}

export const _Inner_data = {
	currentDispatcher
}

export const version = '0.0.0'

// distinguish jsx and jsxDev by environment
export const createElement = jsx
export const isValidElement = isValidElementFn
