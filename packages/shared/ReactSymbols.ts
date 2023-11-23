/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-10-30 23:52:19
 * @Description:
 */
// environment supports symbol or not
const supportSymbol = typeof Symbol === 'function' && Symbol.for

export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('React.element')
	: 0xeac7

export const REACT_FRAGMENT_TYPE = supportSymbol
	? Symbol.for('react.fragment')
	: 0xeacb
