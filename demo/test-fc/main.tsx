/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-11 13:04:30
 * @Description:
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { useState } from 'react'

const App = () => {
	const [num, setNum] = useState(100)
	window.setNum = setNum
	return <div>{num}</div>
}

const Child = () => {
	return <span>Child span</span>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
