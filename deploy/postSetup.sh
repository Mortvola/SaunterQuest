#!/bin/bash

USER=`whoami`

psql -d gis <<EOF
GRANT ALL ON table planet_osm_line TO PUBLIC;
GRANT ALL ON planet_osm_polygon TO PUBLIC;
GRANT ALL ON planet_osm_point TO PUBLIC;
GRANT ALL ON planet_osm_roads TO PUBLIC;

CREATE SEQUENCE IF NOT EXISTS line_id_seq;

ALTER TABLE planet_osm_line
   ADD COLUMN IF NOT EXISTS line_id bigint NOT NULL DEFAULT nextval('line_id_seq'::regclass);

CREATE INDEX planet_osm_line_line_id_idx
  ON planet_osm_line (line_id);

--CREATE USER ${USER};

GRANT ALL ON users TO PUBLIC;
GRANT ALL ON nav_nodes TO PUBLIC;
GRANT ALL ON nav_edges TO PUBLIC;
GRANT ALL ON SEQUENCE nav_edge_id_seq TO PUBLIC;
GRANT ALL ON SEQUENCE nav_node_id_seq TO PUBLIC;

\q
EOF

