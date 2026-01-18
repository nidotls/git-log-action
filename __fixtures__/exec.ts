import type * as exec from '@actions/exec'
import { jest } from '@jest/globals'

type ExecFn = typeof exec.exec

export const exec = jest.fn<ExecFn>()

/**
 * Helper to configure mock git command responses.
 * Call this in your test setup to define what output git commands should return.
 */
export function mockGitOutput(outputs: Record<string, string>): void {
  exec.mockImplementation(
    async (
      command: string,
      args?: string[],
      options?: exec.ExecOptions
    ): Promise<number> => {
      const fullCommand = args ? `${command} ${args.join(' ')}` : command

      // Find matching output based on command pattern
      for (const [pattern, output] of Object.entries(outputs)) {
        if (fullCommand.includes(pattern)) {
          if (options?.listeners?.stdout && output) {
            options.listeners.stdout(Buffer.from(output))
          }
          return 0
        }
      }

      // Default: no output
      return 0
    }
  )
}
