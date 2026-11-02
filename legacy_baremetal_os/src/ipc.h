#ifndef IPC_H
#define IPC_H

typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef unsigned int uint32_t;

#define IPC_QUEUE_SIZE 16
#define IPC_MESSAGE_SIZE 64

typedef struct
{
    int sender;
    int receiver;
    uint32_t data;
} ipc_message_t;

void ipc_init(void);
int ipc_send(int sender, int receiver, uint32_t data);
int ipc_receive(int receiver, ipc_message_t *message);
int ipc_message_count(void);

#endif
