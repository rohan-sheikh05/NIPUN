-- Seed skill taxonomy from the categories named in the NIPUN report (§2.1)
insert into skills (name, category) values
  ('SolidWorks', 'CAD & Design'),
  ('AutoCAD Drafting', 'CAD & Design'),
  ('Altium / PCB Design', 'CAD & Design'),
  ('C/C++ Programming', 'Programming'),
  ('Python', 'Programming'),
  ('Embedded Systems (Arduino/STM32)', 'Programming'),
  ('Basic Web Development', 'Programming'),
  ('Data Analysis & Excel', 'Data & Analysis'),
  ('Materials Characterization', 'Materials Engineering'),
  ('Materials Selection & FEA', 'Materials Engineering'),
  ('LaTeX & Academic Writing', 'Writing & Documentation'),
  ('Technical Report Writing', 'Writing & Documentation'),
  ('3D Modelling & Rendering', 'CAD & Design'),
  ('Circuit Simulation', 'Electronics'),
  ('Robotics & Automation', 'Robotics')
on conflict (name) do nothing;
