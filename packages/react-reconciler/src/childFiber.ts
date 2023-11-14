/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-05 13:47:45
 * @Description:
 */
import { ReactElementType, Props } from 'shared/ReactTypes'
import {
	FiberNode,
	createFiberFromElement,
	createWorkInProgress
} from './fiber'
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import { HostText } from './workTags'
import { ChildDeletion, Placement } from './fiberFlags'
// import ReactDOM from 'react-dom'

const ChildReconciler = (shouldTrackEffects: boolean) => {
	const deleteChild = (returnFiber: FiberNode, childToDelete: FiberNode) => {
		if (!shouldTrackEffects) return
		const deletions = returnFiber.deletions
		if (deletions === null) {
			returnFiber.deletions = [childToDelete]
			returnFiber.flags |= ChildDeletion
		} else {
			deletions.push(childToDelete)
		}
	}
	const reconcileSingleElement = (
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) => {
		const key = element.key
		work: if (currentFiber !== null) {
			// update
			if (currentFiber.key === key) {
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// equal
						// change to the wip
						const existing = useFiber(currentFiber, element.props)
						existing.return = returnFiber
						return existing
					}
					deleteChild(returnFiber, currentFiber)
					break work
				} else {
					if (__DEV__) {
						console.warn('unknown react type', element)
						break work
					}
				}
			} else {
				// delete
				deleteChild(returnFiber, currentFiber)
			}
		}

		const fiber = createFiberFromElement(element)

		fiber.return = returnFiber

		return fiber
	}

	const reconcileSingleTextNode = (
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) => {
		if (currentFiber !== null) {
			// update
			if (currentFiber.tag === HostText) {
				const existing = useFiber(currentFiber, { content })
				existing.return = returnFiber
				return existing
			}
			// <div></div> -> abc
			deleteChild(returnFiber, currentFiber)
		}

		const fiber = new FiberNode(HostText, { content }, null)
		fiber.return = returnFiber

		return fiber
	}

	const placeSingleChild = (fiber: FiberNode) => {
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement
		}
		return fiber
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					)
				default:
					if (__DEV__) {
						console.warn('unknown reconcile type')
					}
					break
			}
		}

		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			)
		}

		if (currentFiber !== null) {
			deleteChild(returnFiber, currentFiber)
		}

		if (__DEV__) {
			console.warn('unknown reconcile type')
		}
		return null
	}
}

const useFiber = (fiber: FiberNode, pendingProps: Props): FiberNode => {
	const clone = createWorkInProgress(fiber, pendingProps)
	clone.index = 0
	clone.sibling = null
	return clone
}

export const reconcileChildFibers = ChildReconciler(true)
export const mountChildFibers = ChildReconciler(false)
