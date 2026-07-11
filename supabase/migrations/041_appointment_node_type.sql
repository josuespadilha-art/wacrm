-- 041_appointment_node_type.sql

ALTER TABLE flow_nodes DROP CONSTRAINT IF EXISTS flow_nodes_node_type_check;

ALTER TABLE flow_nodes ADD CONSTRAINT flow_nodes_node_type_check
CHECK (node_type IN (
  'start',
  'send_buttons',
  'send_list',
  'send_media',
  'send_message',
  'collect_input',
  'if_else',
  'set_tag',
  'handoff',
  'appointment',
  'end'
));
