FROM python:3.12-alpine
RUN apk add --no-cache docker-cli
WORKDIR /runner
COPY .deployment/deploy_agent.py ./deploy_agent.py
COPY .deployment/header_profile.py ./header_profile.py
COPY .deployment/Caddyfile.security-headers.fragment ./security-headers.fragment
ARG FIXTURE_TEST_TYPE=preview
COPY .deployment/tests/${FIXTURE_TEST_TYPE}_deployment.py ./check.py
ENV PYTHONDONTWRITEBYTECODE=1
CMD ["python", "check.py"]
