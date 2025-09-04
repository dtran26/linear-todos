"use strict";
// Sample TypeScript file to demonstrate Linear TODOs extension
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
class UserService {
    users = [];
    // TODO: Implement proper authentication validation
    async authenticateUser(username, password) {
        // FIXME: This is a security vulnerability - passwords should be hashed!
        return this.users.some(user => user.username === username && user.password === password);
    }
    // HACK: Temporary workaround for user creation
    async createUser(userData) {
        // BUG: No validation on email format
        const user = {
            id: Math.random().toString(36),
            ...userData,
            createdAt: new Date()
        };
        this.users.push(user);
        return user;
    }
    // XXX: This method needs optimization for large datasets
    async searchUsers(query) {
        return this.users.filter(user => user.username.includes(query) ||
            user.email.includes(query));
    }
}
exports.UserService = UserService;
// TODO: Add comprehensive error handling throughout the service
// FIXME: Implement proper logging for debugging
// HACK: Replace in-memory storage with database integration
//# sourceMappingURL=sample_code.js.map