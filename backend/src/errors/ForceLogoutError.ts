// src/errors/ForceLogoutError.ts

export class ForceLogoutError extends Error {
	constructor(message = "Force user logout") {
		super(message);
		this.name = "ForceLogoutError";

		// Fix prototype chain for instanceof checks when targeting ES5
		Object.setPrototypeOf(this, ForceLogoutError.prototype);
	}
}
