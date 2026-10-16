bits 32

section .text

global timer_interrupt
extern timer_handler

timer_interrupt:
    pusha
    push ds
    push es
    push fs
    push gs

    mov ax, 0x10
    mov ds, ax
    mov es, ax
    mov fs, ax
    mov gs, ax

    cld
    call timer_handler

    pop gs
    pop fs
    pop es
    pop ds
    popa
    iretd
