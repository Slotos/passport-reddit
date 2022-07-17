/**
 * Module dependencies.
 */
import Strategy from './strategy.js'


/**
 * Framework version.
 */
import { createRequire } from "module"
const version = createRequire(import.meta.url)('../../package.json').version

/**
 * Expose constructors.
 */
export { Strategy, Strategy as RedditStrategy, version }
