bits 32

section .text

global idt_load
global keyboard_interrupt
global default_interrupt

extern idtp
extern keyboard_handler

idt_load:
    lidt [idtp]
    ret

default_interrupt:
    push eax
    mov al, 0x20
    out 0x20, al
    pop eax
    iretd

keyboard_interrupt:
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
    call keyboard_handler

    pop gs
    pop fs
    pop es
    pop ds
    popa
    iretd
