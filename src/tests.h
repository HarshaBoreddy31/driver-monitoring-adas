#ifndef TESTS_H
#define TESTS_H

void tests_init(void);
int test_memory(void);
int test_tasks(void);
int test_scheduler(void);
int test_ipc(void);
int test_synchronization(void);
int test_sensor(void);
int test_monitor(void);
void run_all_tests(void);

#endif
