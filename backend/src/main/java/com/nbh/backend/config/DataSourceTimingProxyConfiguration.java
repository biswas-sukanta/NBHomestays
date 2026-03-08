package com.nbh.backend.config;

import com.nbh.backend.diagnostics.RequestDbMetricsContext;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.Statement;
import java.util.Set;

@Configuration
public class DataSourceTimingProxyConfiguration {

    @Configuration
    static class DataSourceTimingBeanPostProcessor implements BeanPostProcessor {

        @Override
        public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
            if (!(bean instanceof DataSource dataSource) || !"dataSource".equals(beanName)) {
                return bean;
            }
            return createDataSourceProxy(dataSource);
        }

        private DataSource createDataSourceProxy(DataSource delegate) {
            InvocationHandler handler = (proxy, method, args) -> {
                String methodName = method.getName();

                if ("getConnection".equals(methodName)) {
                    long start = System.nanoTime();
                    Connection connection = (Connection) invoke(delegate, method, args);
                    RequestDbMetricsContext.addConnectionAcquireNanos(System.nanoTime() - start);
                    return createConnectionProxy(connection);
                }

                if ("unwrap".equals(methodName) && args != null && args.length == 1 && args[0] instanceof Class<?>) {
                    Class<?> requestedType = (Class<?>) args[0];
                    if (requestedType.isInstance(delegate)) {
                        return delegate;
                    }
                }

                if ("isWrapperFor".equals(methodName) && args != null && args.length == 1 && args[0] instanceof Class<?>) {
                    Class<?> requestedType = (Class<?>) args[0];
                    return requestedType.isInstance(delegate) || (boolean) invoke(delegate, method, args);
                }

                return invoke(delegate, method, args);
            };

            return (DataSource) Proxy.newProxyInstance(
                    DataSource.class.getClassLoader(),
                    new Class<?>[]{DataSource.class},
                    handler);
        }

        private Connection createConnectionProxy(Connection delegate) {
            InvocationHandler handler = (proxy, method, args) -> {
                String methodName = method.getName();
                Object result = invoke(delegate, method, args);

                if (result instanceof Statement statement && isStatementFactoryMethod(methodName)) {
                    return createStatementProxy(statement);
                }

                return result;
            };

            return (Connection) Proxy.newProxyInstance(
                    Connection.class.getClassLoader(),
                    new Class<?>[]{Connection.class},
                    handler);
        }

        private Statement createStatementProxy(Statement delegate) {
            InvocationHandler handler = (proxy, method, args) -> {
                String methodName = method.getName();
                if (SQL_EXECUTION_METHODS.contains(methodName)) {
                    long start = System.nanoTime();
                    try {
                        return invoke(delegate, method, args);
                    } finally {
                        RequestDbMetricsContext.addSqlExecutionNanos(System.nanoTime() - start);
                    }
                }
                return invoke(delegate, method, args);
            };

            return (Statement) Proxy.newProxyInstance(
                    delegate.getClass().getClassLoader(),
                    resolveStatementInterfaces(delegate.getClass()),
                    handler);
        }

        private boolean isStatementFactoryMethod(String methodName) {
            return "createStatement".equals(methodName)
                    || "prepareStatement".equals(methodName)
                    || "prepareCall".equals(methodName);
        }

        private Class<?>[] resolveStatementInterfaces(Class<?> statementClass) {
            Set<Class<?>> interfaces = new java.util.LinkedHashSet<>();
            Class<?> current = statementClass;
            while (current != null) {
                for (Class<?> intf : current.getInterfaces()) {
                    interfaces.add(intf);
                }
                current = current.getSuperclass();
            }
            interfaces.add(Statement.class);
            return interfaces.toArray(new Class<?>[0]);
        }

        private Object invoke(Object target, Method method, Object[] args) throws Throwable {
            try {
                return method.invoke(target, args);
            } catch (InvocationTargetException e) {
                throw e.getTargetException();
            }
        }

        private static final Set<String> SQL_EXECUTION_METHODS = Set.of(
                "execute",
                "executeQuery",
                "executeUpdate",
                "executeLargeUpdate",
                "executeBatch",
                "executeLargeBatch");
    }
}
