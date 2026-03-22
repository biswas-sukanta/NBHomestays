package com.nbh.backend.perf;

import net.ttddyy.dsproxy.listener.MethodExecutionContext;
import net.ttddyy.dsproxy.listener.MethodExecutionListener;
import net.ttddyy.dsproxy.listener.QueryExecutionListener;
import net.ttddyy.dsproxy.support.ProxyDataSource;
import net.ttddyy.dsproxy.support.ProxyDataSourceBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.lang.reflect.Method;
import java.util.List;

@Configuration
public class DataSourceProxyConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceProxyConfig.class);

    @Value("${perf.sql.slow-threshold-ms:50}")
    private long slowSqlThresholdMs;

    @Bean
    public static BeanPostProcessor dataSourceProxyBeanPostProcessor() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                if (bean instanceof DataSource && !(bean instanceof ProxyDataSource)) {
                    QueryExecutionListener listener = new SlowQueryListener();
                    return ProxyDataSourceBuilder.create((DataSource) bean)
                            .name("nbh-ds")
                            .methodListener(new ConnectionAcquireListener())
                            .listener(listener)
                            .build();
                }
                return bean;
            }
        };
    }

    static final class ConnectionAcquireListener implements MethodExecutionListener {

        @Override
        public void beforeMethod(MethodExecutionContext executionContext) {
            // no-op
        }

        @Override
        public void afterMethod(MethodExecutionContext executionContext) {
            if (executionContext == null) {
                return;
            }
            Method method = executionContext.getMethod();
            if (method == null) {
                return;
            }
            if (!"getConnection".equals(method.getName())) {
                return;
            }

            PerfTimingContext ctx = PerfTimingContext.get();
            if (ctx != null) {
                ctx.addDurationNs("connection_acquisition_time", executionContext.getElapsedTime());
            }
        }
    }

    static final class SlowQueryListener implements QueryExecutionListener {

        @Override
        public void beforeQuery(net.ttddyy.dsproxy.ExecutionInfo execInfo, List<net.ttddyy.dsproxy.QueryInfo> queryInfoList) {
            // no-op
        }

        @Override
        public void afterQuery(net.ttddyy.dsproxy.ExecutionInfo execInfo, List<net.ttddyy.dsproxy.QueryInfo> queryInfoList) {
            if (execInfo == null) {
                return;
            }

            long elapsedMs = execInfo.getElapsedTime() / 1_000_000;

            PerfTimingContext ctx = PerfTimingContext.get();
            if (ctx != null) {
                ctx.addDurationNs("database_query_time", execInfo.getElapsedTime());
            }

            if (elapsedMs < 50) {
                return;
            }

            String query = "";
            if (queryInfoList != null && !queryInfoList.isEmpty()) {
                query = String.join("; ", queryInfoList.stream().map(net.ttddyy.dsproxy.QueryInfo::getQuery).toList());
            }

            log.warn("SLOW_SQL elapsedMs={} connId={} success={} query={}",
                    elapsedMs,
                    execInfo.getConnectionId(),
                    execInfo.isSuccess(),
                    query == null ? "" : query.replaceAll("\\s+", " ").trim());
        }
    }
}
