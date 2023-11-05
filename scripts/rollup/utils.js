import path from 'path'
import fs from 'fs'
import ts from 'rollup-plugin-typescript2'
import cjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'

const pkgPath = path.resolve(__dirname, '../../packages')
const distPath = path.resolve(__dirname, '../../dist/node_modules')

export const resolvePackagePath = (pkgName, isDist) => {
	if (isDist) return `${distPath}/${pkgName}`
	return `${pkgPath}/${pkgName}`
}

export const getPackageJSON = (pkgName) => {
	const packageJson = `${resolvePackagePath(pkgName)}/package.json`
	const str = fs.readFileSync(packageJson, { encoding: 'utf-8' })
	return JSON.parse(str)
}

export const getBaseRollupPlugin = ({
	alias = { __DEV__: true },
	typescript = {}
} = {}) => {
	return [replace(alias), cjs(), ts(typescript)]
}
