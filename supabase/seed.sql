insert into users (id, role, display_name) values
  ('11111111-1111-1111-1111-111111111111', 'teacher', 'Demo Teacher')
on conflict (id) do nothing;

insert into assignments (id, teacher_id, title) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Linear Equations — Exit Ticket')
on conflict (id) do nothing;

insert into problems (id, assignment_id, "order", prompt_text, rubric_json) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'Solve for x: 3x + 5 = 20.', '{"type":"vision_numeric","expected":{"value_numeric":5,"tolerance":0},"acceptable_strings":null,"instructions":"Grade the final numeric answer shown; allow equivalent forms.","partial_credit_rules":[{"condition":"correct steps but arithmetic slip","score":0.5}]}'::jsonb),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'Compute \\sqrt{8}/2.', '{"type":"vision_numeric","expected":{"value_numeric":1.41421356,"tolerance":0.01},"acceptable_strings":["sqrt(2)/2"],"instructions":"Accept simplified exact or numeric within tolerance.","partial_credit_rules":[{"condition":"reasonable setup but wrong simplification","score":0.5}]}'::jsonb)
on conflict (id) do nothing;


