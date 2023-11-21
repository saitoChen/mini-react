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

type ExistingChildren = Map<string | number, FiberNode>

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

	const deleteRemainingChildren = (
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null
	) => {
		if (!shouldTrackEffects) return
		let childToDelete = currentFirstChild
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete)
			childToDelete = childToDelete.sibling
		}
	}

	const reconcileSingleElement = (
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) => {
		const key = element.key
		while (currentFiber !== null) {
			// update
			if (currentFiber.key === key) {
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// equal type and equal key
						// change to the wip
						const existing = useFiber(currentFiber, element.props)
						existing.return = returnFiber
						// current node can reuse, remain nodes will delete
						deleteRemainingChildren(returnFiber, currentFiber.sibling)
						return existing
					}
					// equal key and not equal type, remove all old nodes
					deleteRemainingChildren(returnFiber, currentFiber)
					break
				} else {
					if (__DEV__) {
						console.warn('unknown react type', element)
						break
					}
				}
			} else {
				// delete current node
				deleteChild(returnFiber, currentFiber)
				currentFiber = currentFiber.sibling
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
				deleteRemainingChildren(returnFiber, currentFiber.sibling)
				return existing
			}
			// <div></div> -> abc
			deleteChild(returnFiber, currentFiber)
			currentFiber = currentFiber.sibling
		}

		const fiber = new FiberNode(HostText, { content }, null)
		fiber.return = returnFiber

		return fiber
	}

	const reconcileChildrenArray = (
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: any[]
	) => {
		// the last fiber that we can reuse
		let lastPlacedIndex: number = 0
		//  the last fiber that we create
		let lastNewFiber: FiberNode | null = null
		let firstNewFiber: FiberNode | null = null
		// set current store into map
		const existingChildren: ExistingChildren = new Map()
		let current = currentFirstChild
		while (current) {
			const keyToUse = current.key !== null ? current.key : current.index
			existingChildren.set(keyToUse, current)
			current = current.sibling
		}

		for (let i = 0; i < newChild.length; i++) {
			// iterate newChild, and find it reuseable or not
			const after = newChild[i]

			const newFiber = updateFromMap(returnFiber, existingChildren, i, after)

			if (newFiber === null) {
				continue
			}
			// Mark it and determine whether it needs to be moved or inserted
			newFiber.index = i
			newFiber.return = returnFiber

			if (lastNewFiber === null) {
				lastNewFiber = newFiber
				firstNewFiber = newFiber
			} else {
				lastNewFiber.sibling = newFiber
				lastNewFiber = lastNewFiber.sibling
			}

			if (!shouldTrackEffects) continue

			const current = newFiber.alternate
			if (current !== null) {
				const oldIndex = current.index
				if (oldIndex < lastPlacedIndex) {
					// move
					newFiber.flags |= Placement
					continue
				} else {
					// unmove
					lastPlacedIndex = oldIndex
				}
			} else {
				// insert
				newFiber.flags |= Placement
			}
		}
		// the remaining nodes are marked deletion
		existingChildren.forEach((fiber) => {
			deleteChild(returnFiber, fiber)
		})

		return firstNewFiber
	}

	const placeSingleChild = (fiber: FiberNode) => {
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement
		}
		return fiber
	}

	const updateFromMap = (
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: any
	): FiberNode | null => {
		const keyToUse = element.key !== null ? element.key : index
		const before = existingChildren.get(keyToUse)

		if (typeof element === 'string' || typeof element === 'number') {
			// HostText
			if (before) {
				if (before.tag === HostText) {
					// reuse HostText
					existingChildren.delete(keyToUse)
					return useFiber(before, { content: element + '' })
				}
			}
			// unreuse or new fiber
			return new FiberNode(HostText, { content: element + '' }, null)
		}
		// ReactElementType
		if (typeof element === 'object' && element !== 'null') {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (before) {
						if (before.type === element.type) {
							existingChildren.delete(keyToUse)
							return useFiber(before, element.props)
						}
					}
					return createFiberFromElement(element)

				default:
					break
			}
		}
		return null
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
			if (Array.isArray(newChild)) {
				return reconcileChildrenArray(returnFiber, currentFiber, newChild)
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
