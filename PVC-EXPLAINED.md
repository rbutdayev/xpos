# PVC (PersistentVolumeClaim) Explained

## Your Current Setup

Looking at your `.env.production`:

```env
FILESYSTEM_DISK=local          # ← Files stored locally!
CACHE_STORE=redis              # ✅ In Redis (no PVC needed)
SESSION_DRIVER=redis           # ✅ In Redis (no PVC needed)
AZURE_STORAGE_CONNECTION_STRING=... # ← Available but not used
```

## Why You Need PVC

### Problem Without PVC:

```
┌─────────────┐
│ Web Pod 1   │ → User uploads receipt.pdf
│ /storage    │    Saved to THIS pod only
└─────────────┘

┌─────────────┐
│ Web Pod 2   │ → User tries to download receipt.pdf
│ /storage    │    File NOT HERE! ❌ 404 Error
└─────────────┘
```

**Each pod has its own storage!** Files uploaded to Pod 1 are not visible to Pod 2.

### Solution With PVC:

```
┌─────────────┐
│ Web Pod 1   │ ────┐
└─────────────┘     │
                    ├──→ ┌─────────────────┐
┌─────────────┐     │    │ Shared Storage  │
│ Web Pod 2   │ ────┤    │   (PVC/NFS)     │
└─────────────┘     │    │                 │
                    │    │ - uploads/      │
┌─────────────┐     │    │ - logs/         │
│ Web Pod 3   │ ────┘    │ - cache/        │
└─────────────┘          └─────────────────┘
```

**All pods share the same storage!** ✅

## What Goes in PVC?

```
/var/www/storage/
├── app/
│   ├── public/          # Public uploads (product images, receipts)
│   └── private/         # Private files (invoices, reports)
├── framework/
│   ├── cache/           # Compiled views (not needed with Redis)
│   └── sessions/        # Not needed (you use Redis sessions)
├── logs/                # Application logs
└── temp/                # Temporary files
```

### What Needs PVC:
- ✅ **File uploads** (receipts, invoices, product images)
- ✅ **Generated reports** (PDFs, exports)
- ⚠️ **Logs** (optional - can use stdout instead)

### What Doesn't Need PVC:
- ❌ Cache (you use Redis)
- ❌ Sessions (you use Redis)
- ❌ Queue jobs (you use Redis)

## Your Two Options

### Option 1: Keep PVC (Current)

**Pros:**
- ✅ Simple - works out of the box
- ✅ Fast local file access
- ✅ No code changes needed

**Cons:**
- ⚠️ Requires **ReadWriteMany** storage (NFS, CephFS, Azure Files)
- ⚠️ More expensive
- ⚠️ Single point of failure

**Cost:** ~$10-50/month for 100GB

**When to use:**
- You have NFS/CephFS available
- Small file storage needs (<100GB)
- Don't want to change code

### Option 2: Use Azure Storage (Recommended)

**Pros:**
- ✅ Scales infinitely
- ✅ No PVC needed
- ✅ Built-in backups
- ✅ CDN integration
- ✅ You already have Azure Storage configured!

**Cons:**
- ⚠️ Slightly slower than local
- ⚠️ Need to change `FILESYSTEM_DISK` config

**Cost:** ~$0.02/GB/month (way cheaper!)

**When to use:**
- Large file storage (100GB+)
- Multiple environments
- Want scalability

## How to Switch to Azure Storage

You already have Azure Storage configured! Just change:

```yaml
# iac/helm/xpos/values-prod.yaml
config:
  filesystem:
    disk: azure  # ← Change from 'local'

# Add Azure credentials to secrets
secrets:
  azureStorageConnectionString: "DefaultEndpointsProtocol=https;AccountName=onyxbms;..."
```

**Then remove PVC:**

```yaml
# iac/helm/xpos/values-prod.yaml
persistence:
  enabled: false  # ← Disable PVC
```

## My Recommendation

**For Production:** Use Azure Storage (Option 2)
- You already have it configured!
- Cheaper and more scalable
- No ReadWriteMany storage needed

**For Dev:** Keep PVC or use local storage
- Simpler for testing
- Can use `ReadWriteOnce` (easier)

## Current PVC Configuration

```yaml
# iac/helm/xpos/values-prod.yaml
persistence:
  enabled: true
  accessMode: ReadWriteMany  # ← Requires NFS/CephFS/Azure Files
  size: 100Gi                # ← 100GB storage
```

**ReadWriteMany** means:
- Multiple pods can read AND write to the same volume
- Requires special storage: NFS, CephFS, Azure Files, AWS EFS
- Standard block storage (like AWS EBS) doesn't support this

## Quick Decision Tree

```
Do you have file uploads? (receipts, images, reports)
├─ No → Disable PVC (set persistence.enabled: false)
└─ Yes
   ├─ Using Azure Storage? → Disable PVC
   └─ Using local storage?
      ├─ Have NFS/CephFS? → Keep PVC ✅
      └─ No NFS/CephFS? → Use Azure Storage instead
```

## What Should You Do?

**For your setup (XPOS POS system):**

1. **You probably have file uploads** (receipts, invoices)
2. **You already have Azure Storage**
3. **Recommendation:** Switch to Azure Storage

### Quick Switch:

```bash
# 1. Update values-prod.yaml
nano iac/helm/xpos/values-prod.yaml

# Change:
persistence:
  enabled: false  # ← Disable PVC

config:
  filesystem:
    disk: azure
    azureContainer: xpos

# 2. Add Azure credentials to secrets section
secrets:
  azureStorageConnectionString: "DefaultEndpointsProtocol=https;AccountName=onyxbms;AccountKey=IyNToyDDhyLD/1pUmUQy2sCbKbOqrdBPMVqL07z+3jcRILEfYfzHp/rmKSmm8DDi+EVHnpwVrSpt+AStR2el8A==;EndpointSuffix=core.windows.net"
```

## Summary

| Feature | With PVC | With Azure Storage |
|---------|----------|-------------------|
| **Multiple pods access files** | ✅ | ✅ |
| **Survives pod restarts** | ✅ | ✅ |
| **Requires special storage** | ⚠️ ReadWriteMany | ❌ No |
| **Cost (100GB)** | ~$30/month | ~$2/month |
| **Speed** | Fast | Slightly slower |
| **Scalability** | Limited | Unlimited |
| **Backup** | Manual | Automatic |
| **You already have it** | ❌ | ✅ |

**Recommendation:** Switch to Azure Storage! You already have it configured. 🚀
