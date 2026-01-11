# Distributed Logging & Traceability Guide

This document explains how to track requests, debug issues, and analyze logs across multiple Kubernetes pods.

## What's Been Implemented

### 1. Correlation ID / Request ID
Every request now gets a unique `X-Request-ID` header that:
- Is automatically generated or accepted from incoming requests
- Is included in all log entries for that request
- Is returned in response headers
- Allows tracking a single request across all pods

### 2. Request Context Logging
All logs now include:
- **request_id**: Unique ID for the request
- **pod_name**: Which Kubernetes pod handled the request
- **user_id**: Authenticated user ID
- **account_id**: Multitenant account ID
- **ip**: Client IP address
- **user_agent**: Client user agent

### 3. Structured JSON Logging
Logs can now be output in JSON format for easy parsing by log aggregation tools.

### 4. Enhanced Exception Logging
All exceptions are automatically logged with full context including stack traces.

## Configuration

### For Kubernetes (Recommended)

Update your `.env` file:

```env
# Use JSON logging for Kubernetes
LOG_CHANNEL=kubernetes

# Optional: Log memory usage
LOG_MEMORY_USAGE=false

# Log level (debug, info, warning, error)
LOG_LEVEL=info
```

### For Local Development

```env
LOG_CHANNEL=stack
LOG_STACK=daily,stderr
```

## Usage Examples

### 1. Tracking a Specific Request Across Pods

When a user reports an error (e.g., "I got a 413 error"), ask them to:
1. Check their browser's Network tab for the response headers
2. Copy the `X-Request-ID` header value

Then search logs:

```bash
# In Kubernetes
kubectl logs -l app=xpos --tail=10000 | grep "REQUEST_ID_HERE"

# Using Laravel command (on specific pod)
php artisan logs:analyze --request-id=REQUEST_ID_HERE
```

### 2. Finding Errors from a Specific User

```bash
# Laravel command
php artisan logs:analyze --user=123 --level=error

# Kubernetes
kubectl logs -l app=xpos --tail=10000 | grep '"user_id":123' | grep '"level":"error"'
```

### 3. Finding All 413 Errors

```bash
# Laravel command
php artisan logs:analyze --status=413 --tail=1000

# Kubernetes
kubectl logs -l app=xpos --tail=10000 | grep '"status":413'
```

### 4. Checking Which Pod Had Issues

```bash
# Laravel command shows pod name in output
php artisan logs:analyze --status=500 --tail=500

# Kubernetes - group by pod
kubectl logs -l app=xpos --tail=10000 | grep '"level":"error"' | grep -o '"pod_name":"[^"]*"' | sort | uniq -c
```

## Setting Up Centralized Logging (Recommended for Production)

For multi-pod Kubernetes setups, centralized logging is essential. Here are the best options:

### Option 1: ELK Stack (Elasticsearch, Logstash, Kibana)

1. Install Elastic Cloud on Kubernetes (ECK):
```bash
kubectl apply -f https://download.elastic.co/downloads/eck/2.10.0/crds.yaml
kubectl apply -f https://download.elastic.co/downloads/eck/2.10.0/operator.yaml
```

2. Deploy Elasticsearch and Kibana
3. Configure Filebeat to ship logs from all pods
4. Search logs in Kibana by request_id, pod_name, user_id, etc.

### Option 2: Loki + Grafana

1. Install Loki using Helm:
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack
```

2. Query logs in Grafana using LogQL:
```logql
{app="xpos"} |= "request_id" | json | status >= 400
{app="xpos"} | json | pod_name="xpos-5f7c8b9d4-xyz"
```

### Option 3: Cloud Provider Solutions

- **AWS**: Use CloudWatch Logs with Container Insights
- **GCP**: Use Cloud Logging (formerly Stackdriver)
- **Azure**: Use Azure Monitor

### Option 4: Third-Party Services

- **Datadog**: Full APM + logging
- **New Relic**: Application monitoring with logs
- **Sentry**: Error tracking with context
- **Papertrail**: Simple log aggregation (already configured in logging.php)

## Kubernetes Deployment Configuration

Update your deployment to ensure HOSTNAME is set:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: xpos
spec:
  template:
    spec:
      containers:
      - name: xpos
        env:
        - name: HOSTNAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: LOG_CHANNEL
          value: "kubernetes"
        - name: LOG_LEVEL
          value: "info"
```

## Debugging Common Issues

### Issue: Can't find which pod handled a request

**Solution**:
1. Check response headers for `X-Request-ID`
2. Search all pod logs: `kubectl logs -l app=xpos | grep "REQUEST_ID"`
3. The log entry will show `pod_name`

### Issue: 413 Payload Too Large errors

**Check**:
1. Nginx ingress configuration: `client-max-body-size`
2. PHP configuration: `upload_max_filesize`, `post_max_size`
3. Laravel logs will show which endpoint was hit

```bash
php artisan logs:analyze --status=413 --tail=1000
```

### Issue: Intermittent errors only on some pods

**Solution**:
1. Get error's request_id from user
2. Find which pod handled it: `kubectl logs -l app=xpos | grep REQUEST_ID`
3. Check that specific pod: `kubectl logs POD_NAME`
4. Check pod resources: `kubectl describe pod POD_NAME`

### Issue: Can't correlate frontend error with backend logs

**Solution**:
Add request ID to your frontend error tracking:

```javascript
// In your frontend code
const response = await fetch('/api/endpoint');
const requestId = response.headers.get('X-Request-ID');

// Include in error reports
console.error('API error', { requestId, status: response.status });
```

## Log Analysis Commands

### Artisan Command Options

```bash
# Filter by request ID
php artisan logs:analyze --request-id=abc-123

# Filter by HTTP status
php artisan logs:analyze --status=500

# Filter by user
php artisan logs:analyze --user=123

# Filter by account (important for multitenant!)
php artisan logs:analyze --account=5

# Filter by log level
php artisan logs:analyze --level=error

# Filter by pod name
php artisan logs:analyze --pod=xpos-5f7c8b9d4-abc123

# Combine filters
php artisan logs:analyze --account=5 --level=error --tail=500

# More history
php artisan logs:analyze --tail=5000
```

## Best Practices

1. **Always use request IDs**: When reporting bugs, include the X-Request-ID
2. **Log strategically**: Don't log sensitive data (passwords, tokens)
3. **Use appropriate log levels**:
   - `debug`: Detailed debugging information
   - `info`: Interesting events (user login, request completed)
   - `warning`: Exceptional occurrences that are not errors
   - `error`: Runtime errors that don't require immediate action
   - `critical`: Critical conditions
4. **Monitor log volume**: Too much logging can impact performance
5. **Set up alerts**: Use your logging solution to alert on error spikes
6. **Retain logs**: Keep at least 30 days of logs for compliance

## Adding Custom Context to Logs

In your code, add extra context:

```php
use Illuminate\Support\Facades\Log;

// Add context to all subsequent logs in this request
Log::shareContext([
    'order_id' => $orderId,
    'payment_method' => $paymentMethod,
]);

// Log with additional context
Log::info('Order processed', [
    'order_id' => $orderId,
    'amount' => $amount,
]);
```

## Monitoring Dashboard Setup

Consider setting up a dashboard showing:
1. Error rate per pod
2. Average response time per pod
3. Request count per pod
4. Most common error types
5. Slowest endpoints

Use Grafana + Loki or Kibana + Elasticsearch for this.

## Support

For issues with logging setup, check:
1. PHP error logs: `kubectl logs POD_NAME`
2. Laravel logs: `kubectl exec POD_NAME -- tail -f storage/logs/laravel.log`
3. Pod events: `kubectl describe pod POD_NAME`
