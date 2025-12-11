{{/*
Expand the name of the chart.
*/}}
{{- define "xpos.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "xpos.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "xpos.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "xpos.labels" -}}
helm.sh/chart: {{ include "xpos.chart" . }}
{{ include "xpos.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "xpos.selectorLabels" -}}
app.kubernetes.io/name: {{ include "xpos.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "xpos.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "xpos.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Get the image tag
*/}}
{{- define "xpos.imageTag" -}}
{{- .Values.image.tag | default .Chart.AppVersion }}
{{- end }}

{{/*
Web image
*/}}
{{- define "xpos.webImage" -}}
{{- printf "%s/%s-%s:%s" .Values.image.registry .Values.image.repository .Values.web.image.name (include "xpos.imageTag" .) }}
{{- end }}

{{/*
Worker image
*/}}
{{- define "xpos.workerImage" -}}
{{- printf "%s/%s-%s:%s" .Values.image.registry .Values.image.repository .Values.worker.image.name (include "xpos.imageTag" .) }}
{{- end }}

{{/*
Scheduler image
*/}}
{{- define "xpos.schedulerImage" -}}
{{- printf "%s/%s-%s:%s" .Values.image.registry .Values.image.repository .Values.scheduler.image.name (include "xpos.imageTag" .) }}
{{- end }}

{{/*
Secret name
*/}}
{{- define "xpos.secretName" -}}
{{- if .Values.secrets.existingSecret }}
{{- .Values.secrets.existingSecret }}
{{- else }}
{{- include "xpos.fullname" . }}-secrets
{{- end }}
{{- end }}
