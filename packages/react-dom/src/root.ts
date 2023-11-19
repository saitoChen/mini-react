/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-07 22:25:43
 * @Description:
 */
import {
	createContainer,
	updateContainer
} from 'react-reconciler/src/fiberReconciler'
import { Container } from './hostConfig'
import { ReactElementType } from 'shared/ReactTypes'
import { initEvent } from './SyntheticEvents'

export const createRoot = (container: Container) => {
	const root = createContainer(container)

	return {
		render(element: ReactElementType) {
			initEvent(container, 'click')
			return updateContainer(element, root)
		}
	}
}
