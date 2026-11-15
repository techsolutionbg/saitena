FROM python:3.12-alpine
RUN apk add --no-cache docker-cli
WORKDIR /runner
COPY .deployment/deploy_agent.py ./deploy_agent.py
COPY .deployment/tests/preview_deployment.py ./check.py
ENV PYTHONDONTWRITEBYTECODE=1
CMD ["python", "check.py"]
