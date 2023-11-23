/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-11 13:04:30
 * @Description:
 */
import ReactDOM from 'react-dom/client'
import { useState } from 'react'

const App = () => {
	const [num, setNum] = useState(100)

	const arr =
		num % 2 === 0
			? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
			: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>]

	return (
		<ul onClick={() => setNum(num + 1)}>
			<li>7</li>
			<li>9</li>
			{arr}
		</ul>
	)

	return <ul onClick={() => setNum(num + 1)}>{arr}</ul>
}

const Child = () => {
	return <span>Child span</span>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
