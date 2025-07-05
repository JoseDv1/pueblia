import type { ValidationTargets } from 'hono'
import { zValidator as zv } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import type * as z from 'zod/v4/core'

export const zValidator = <T extends z.$ZodType, Target extends keyof ValidationTargets>(
	target: Target,
	schema: T
) =>
	zv(target, schema, (result, _c) => {
		if (!result.success) {
			const issues = result.error.issues.map(issue => {
				return { path: issue.path.toString(), message: issue.message }
			})

			const errorMessage = "Validation Error"


			// If validation fails, throw an HTTPException with a 400 status code
			throw new HTTPException(400, {
				cause: result.error,
				res: new Response(JSON.stringify({ message: errorMessage, issues }), {
					headers: {
						'Content-Type': 'application/json',
					},
					status: 400,
				}),
			})
		}
	})



