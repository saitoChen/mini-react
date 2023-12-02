/*
 * @Author: chenjianfeng chenjianfeng93@163.com
 * @Date: 2023-11-11 13:04:30
 * @Description:
 */
import ReactDOM from 'react-dom/client'
import { useEffect, useState } from 'react'

// const App = () => {
// 	const [num, setNum] = useState(100)

// 	// return (
// 	// 	<ul
// 	// 		onClickCapture={() => {
// 	// 			setNum((num) => num + 1)
// 	// 			setNum((num) => num + 1)
// 	// 			setNum((num) => num + 1)
// 	// 		}}
// 	// 	>
// 	// 		{num}
// 	// 	</ul>
// 	// )

// 	// const arr =
// 	// 	num % 2 === 0
// 	// 		? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
// 	// 		: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>]

// 	// return (
// 	// 	<ul onClick={() => setNum(num + 1)}>
// 	// 		<li>7</li>
// 	// 		<li>9</li>
// 	// 		{arr}
// 	// 	</ul>
// 	// )

// 	return (
// 		<ul
// 			onClick={() => {
// 				setNum((num) => num + 1)
// 				setNum((num) => num + 1)
// 				setNum((num) => num + 1)
// 			}}
// 		>
// 			{num}
// 		</ul>
// 	)
// }

// const Child = () => {
// 	return <span>Child span</span>
// }

function App() {
	const [num, updateNum] = useState(0)
	useEffect(() => {
		console.log('App mount')
	}, [])

	useEffect(() => {
		console.log('num change create', num)
		return () => {
			console.log('num change destory', num)
		}
	}, [num])

	return (
		<div onClick={() => updateNum(num + 1)}>
			{num === 0 ? <Child /> : 'noop'}
		</div>
	)
}

function Child() {
	useEffect(() => {
		console.log('Child mount')
		return () => console.log('Child unmount')
	}, [])

	return 'I am Child'
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
