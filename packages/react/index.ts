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
import { jsxDEV } from './src/jsx'

export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resolveDispatcher()
	return dispatcher.useState(initialState)
}

export const _Inner_data = {
	currentDispatcher
}

export default {
	version: '0.0.1',
	createElement: jsxDEV
}
