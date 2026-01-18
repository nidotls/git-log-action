import type { Commit } from '../src/git.js'
import { jest } from '@jest/globals'

export const getTags = jest.fn<() => Promise<string[]>>()
export const getCommitsBetween =
  jest.fn<(from: string | undefined, to: string) => Promise<Commit[]>>()
