// Sample TypeScript file to demonstrate Linear TODOs extension

export class UserService {
	private users: User[] = [];

	// TODO: Implement proper authentication validation
	async authenticateUser(username: string, password: string): Promise<boolean> {
		// FIXME: This is a security vulnerability - passwords should be hashed!
		return this.users.some(
			(user) => user.username === username && user.password === password,
		);
	}

	// HACK: Temporary workaround for user creation
	async createUser(userData: CreateUserRequest): Promise<User> {
		// BUG: No validation on email format
		const user = {
			id: Math.random().toString(36),
			...userData,
			createdAt: new Date(),
		};

		this.users.push(user);
		return user;
	}

	// XXX: This method needs optimization for large datasets
	async searchUsers(query: string): Promise<User[]> {
		return this.users.filter(
			(user) => user.username.includes(query) || user.email.includes(query),
		);
	}
}

interface User {
	id: string;
	username: string;
	email: string;
	password: string; // TODO: Remove password from user interface
	createdAt: Date;
}

interface CreateUserRequest {
	username: string;
	email: string;
	password: string;
}

// TODO: Add comprehensive error handling throughout the service
// FIXME: Implement proper logging for debugging
// HACK: Replace in-memory storage with database integration
