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
			throw new HTTPException(400, { cause: result.error })
		}
	})

