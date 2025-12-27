# Contributing to ThaiTide

Thank you for your interest in contributing to ThaiTide! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professional communication

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/thaitide-dating.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit with clear messages
7. Push to your fork
8. Create a Pull Request

## Development Setup

See [SETUP.md](SETUP.md) for detailed setup instructions.

Quick start:
```bash
./setup.sh
```

## Project Structure

```
thaitide-dating/
├── backend/          # Node.js/Express API
│   ├── src/
│   │   ├── models/      # Mongoose models
│   │   ├── controllers/ # Route handlers
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── config/      # Configuration
│   └── package.json
└── frontend/         # Next.js frontend
    ├── src/
    │   ├── app/        # Pages (App Router)
    │   ├── components/ # React components
    │   └── lib/        # Utilities
    └── package.json
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid `any` unless absolutely necessary
- Use meaningful variable names

### React/Next.js

- Use functional components with hooks
- Follow React best practices
- Use 'use client' directive when needed
- Implement proper error handling

### Node.js/Express

- Use async/await for async operations
- Implement proper error handling
- Validate input data
- Follow RESTful API conventions

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Follow existing code patterns

## Testing

- Write tests for new features
- Ensure existing tests pass
- Test on different screen sizes (mobile-first)
- Test with different browsers

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add photo upload to profile page
fix: Resolve Socket.io connection issue
docs: Update setup instructions
style: Format code with prettier
refactor: Simplify matching algorithm
test: Add tests for user controller
```

Prefix types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

## Pull Request Process

1. **Update Documentation**: If you change functionality, update relevant docs
2. **Test Thoroughly**: Ensure all tests pass and features work
3. **Screenshots**: Include screenshots for UI changes
4. **Description**: Provide clear description of changes
5. **Link Issues**: Reference related issues

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Local testing completed
- [ ] Tests added/updated
- [ ] All tests passing

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows project style
- [ ] Documentation updated
- [ ] No console errors
- [ ] Responsive design verified
```

## Feature Requests

To suggest features:
1. Open an issue
2. Use "Feature Request" template
3. Describe the feature clearly
4. Explain the use case
5. Consider implementation details

## Bug Reports

To report bugs:
1. Open an issue
2. Use "Bug Report" template
3. Describe the bug
4. Steps to reproduce
5. Expected vs actual behavior
6. Screenshots if applicable
7. Environment details

## Areas for Contribution

### High Priority
- Internationalization (Thai/English translations)
- Photo upload implementation
- Video call feature
- Mobile app development
- Performance optimization

### Medium Priority
- Additional filters
- Profile badges
- User reporting system
- Email notifications
- Push notifications

### Documentation
- API documentation
- Code comments
- Tutorial videos
- Blog posts

## Development Tips

### Database

View data:
```bash
mongosh mongodb://localhost:27017/thaitide-dating
db.users.find()
```

### API Testing

Test endpoints:
```bash
curl http://localhost:5000/api/health
```

### Debug Frontend

```bash
cd frontend
npm run dev
# Open http://localhost:3000
# Use React DevTools in browser
```

### Debug Backend

```bash
cd backend
npm run dev
# Use debugger or console.log
```

## Questions?

- Open an issue for questions
- Check existing issues and PRs
- Review documentation

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (ISC).

---

Thank you for contributing to ThaiTide! 🌊❤️
