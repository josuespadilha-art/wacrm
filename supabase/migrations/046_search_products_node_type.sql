-- 046_search_products_node_type.sql

ALTER TABLE flow_nodes DROP CONSTRAINT IF EXISTS flow_nodes_node_type_check;

ALTER TABLE flow_nodes ADD CONSTRAINT flow_nodes_node_type_check
CHECK (node_type IN (
  'start',
  'send_buttons',
  'send_list',
  'send_media',
  'send_message',
  'collect_input',
  'condition',
  'if_else',
  'set_tag',
  'handoff',
  'appointment',
  'change_pipeline_stage',
  'search_products',
  'end'
));
