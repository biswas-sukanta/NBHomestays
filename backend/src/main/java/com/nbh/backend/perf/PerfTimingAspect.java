package com.nbh.backend.perf;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class PerfTimingAspect {

    @Around("within(@org.springframework.web.bind.annotation.RestController *)")
    public Object timeController(ProceedingJoinPoint pjp) throws Throwable {
        PerfTimingContext ctx = PerfTimingContext.get();
        long start = System.nanoTime();
        try {
            return pjp.proceed();
        } finally {
            long dur = System.nanoTime() - start;
            if (ctx != null) {
                ctx.addDurationNs("controller_execution", dur);
            }
        }
    }

    @Around("within(@org.springframework.stereotype.Service *)")
    public Object timeService(ProceedingJoinPoint pjp) throws Throwable {
        PerfTimingContext ctx = PerfTimingContext.get();
        long start = System.nanoTime();
        try {
            return pjp.proceed();
        } finally {
            long dur = System.nanoTime() - start;
            if (ctx != null) {
                ctx.addDurationNs("service_execution", dur);
            }
        }
    }

    @Around("within(@org.springframework.stereotype.Repository *)")
    public Object timeRepository(ProceedingJoinPoint pjp) throws Throwable {
        PerfTimingContext ctx = PerfTimingContext.get();
        long start = System.nanoTime();
        try {
            return pjp.proceed();
        } finally {
            long dur = System.nanoTime() - start;
            if (ctx != null) {
                ctx.addDurationNs("repository_execution", dur);
            }
        }
    }
}
