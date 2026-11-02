# ==========================================
# Driver Monitoring OS - Makefile
# ==========================================

CC = gcc
AS = nasm
LD = ld

CFLAGS = -m32 -ffreestanding -fno-stack-protector -fno-builtin -nostdlib -Wall -Wextra -O2
ASFLAGS = -f elf32
LDFLAGS = -m elf_i386 -T src/linker.ld -nostdlib

SRC_DIR = src
BUILD_DIR = build
ISO_DIR = iso
TARGET = $(BUILD_DIR)/kernel.bin
ISO_TARGET = driver_monitoring_os.iso

# C and Assembly source files
C_SOURCES = $(wildcard $(SRC_DIR)/*.c)
ASM_SOURCES = $(wildcard $(SRC_DIR)/*.asm)

# Object files
C_OBJECTS = $(patsubst $(SRC_DIR)/%.c, $(BUILD_DIR)/%.o, $(C_SOURCES))
ASM_OBJECTS = $(patsubst $(SRC_DIR)/%.asm, $(BUILD_DIR)/%.o, $(ASM_SOURCES))
OBJECTS = $(ASM_OBJECTS) $(C_OBJECTS)

.PHONY: all clean iso run run-iso run-sim

all: $(TARGET)

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.asm | $(BUILD_DIR)
	$(AS) $(ASFLAGS) $< -o $@

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c | $(BUILD_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(TARGET): $(OBJECTS)
	$(LD) $(LDFLAGS) -o $@ $(OBJECTS)
	@mkdir -p $(ISO_DIR)/boot
	cp $(TARGET) $(ISO_DIR)/boot/kernel.bin
	@echo "Kernel built successfully: $@"

iso: $(TARGET)
	grub-mkrescue -o $(ISO_TARGET) $(ISO_DIR)
	@echo "Bootable ISO built successfully: $(ISO_TARGET)"

run: $(TARGET)
	qemu-system-i386 -kernel $(TARGET)

run-iso: iso
	qemu-system-i386 -cdrom $(ISO_TARGET)

run-sim:
	python main.py

clean:
	rm -rf $(BUILD_DIR)/*.o $(BUILD_DIR)/kernel.bin $(ISO_TARGET)
	@echo "Cleaned build artifacts."

