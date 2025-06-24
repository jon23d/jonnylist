FROM couchdb:latest
RUN mkdir -p /opt/couchdb/etc/local.d
COPY local.ini /opt/couchdb/etc/local.d/local.ini
VOLUME ["/opt/couchdb/data"]
