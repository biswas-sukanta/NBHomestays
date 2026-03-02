# Pull Request Checklist

## 🔍 Dependency Changes

### Major Version Upgrades
- [ ] **OkHttp**: Verify ImageKit SDK compatibility (must be 4.x)
- [ ] **Okio**: Verify compatibility with OkHttp
- [ ] **Jackson**: Verify Hibernate and Spring Boot compatibility
- [ ] **JWT**: Verify security configuration compatibility
- [ ] **Spring Boot**: Verify all starter dependencies compatibility

### Minor Version Upgrades
- [ ] Check for any deprecation warnings
- [ ] Verify transitive dependency compatibility
- [ ] Run full test suite

## 🧪 Testing Requirements

### Mandatory Tests
- [ ] **Unit Tests**: All unit tests must pass
- [ ] **Integration Tests**: Core integration tests must pass
- [ ] **ImageKit Startup Test**: Must pass (validates OkHttp compatibility)
- [ ] **Application Startup Smoke Test**: Must pass (validates full startup)

### Additional Validation
- [ ] **Build Success**: `mvn clean package` must succeed
- [ ] **Application Startup**: Must start without NoClassDefFoundError
- [ ] **Core Endpoints**: Basic endpoints must respond (not 500 errors)
- [ ] **Actuator Health**: Health endpoint must be accessible

## 🚀 Production Readiness

### Configuration
- [ ] **Environment Variables**: All required env vars documented
- [ ] **Logging Configuration**: Logback configuration valid
- [ ] **Database Configuration**: Connection strings and Flyway config correct
- [ ] **Security Configuration**: JWT and other security settings correct

### Performance & Reliability
- [ ] **Memory Usage**: No significant memory leaks
- [ ] **Startup Time**: Application starts within acceptable time
- [ ] **Error Rates**: No increase in error rates
- [ **Dependencies**: No conflicting dependency versions

## 📋 Documentation

### Change Documentation
- [ ] **Commit Messages**: Clear and descriptive
- [ ] **PR Description**: Explains what changed and why
- [ ] **Breaking Changes**: Documented if any
- [ ] **Migration Notes**: Provided if needed

### Testing Documentation
- [ ] **Test Results**: All test results attached
- [ ] **Validation Evidence**: Build and startup logs provided
- [ ] **Known Issues**: Any known issues documented
- [ ] **Rollback Plan**: Clear rollback procedure documented

## ⚠️ Special Considerations

### Java 21 + Spring Boot 3.3.5 Migration
- [ ] **OkHttp Compatibility**: Must remain at 4.x for ImageKit
- [ ] **Loki Logging**: Conditional appender configuration
- [ ] **Flyway Configuration**: Production-safe (out-of-order: false)
- [ ] **Test Coverage**: No regressions in test count or functionality

### Post-Incident Safeguards
- [ ] **Dependency Guardrails**: Run compatibility check script
- [ ] **Startup Validation**: Smoke tests must pass
- [ ] **ImageKit Integration**: Specific test for SDK compatibility
- [ ] **Manual Review**: Major version changes require explicit approval

---

## 🚨 STOP CONDITIONS

**DO NOT MERGE if any of the following are true:**

1. **NoClassDefFoundError**: Any NoClassDefFoundError during startup
2. **Test Failures**: Any core test failures related to the changes
3. **Major Version Conflicts**: Unvalidated major version dependency changes
4. **Startup Failures**: Application fails to start completely
5. **Missing Validation**: Required tests or checks not completed

## ✅ APPROVAL REQUIREMENTS

- [ ] **Self-Review**: All checklist items completed
- [ ] **Technical Review**: At least one technical team member review
- [ ] **Production Safety**: Confirmed safe for production deployment
- [ ] **Rollback Plan**: Tested and documented rollback procedure

---

**Remember**: This checklist was created after a production outage caused by OkHttp 5.x incompatibility. Be conservative and thorough.
