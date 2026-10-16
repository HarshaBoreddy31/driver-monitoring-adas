#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>

int main()
{
    int fd, choice;
    struct flock lock;

    // Open the file
    fd = open("sample.txt", O_RDWR | O_CREAT, 0666);

    if (fd == -1)
    {
        perror("Error opening file");
        return 1;
    }

    printf("File opened successfully.\n");

    printf("\n--- FILE LOCKING MENU ---\n");
    printf("1. Apply Read Lock\n");
    printf("2. Apply Write Lock\n");
    printf("3. Check Lock Status\n");
    printf("4. Unlock File\n");
    printf("5. Exit\n");

    printf("Enter your choice: ");
    scanf("%d", &choice);

    // Initialize lock structure
    lock.l_whence = SEEK_SET;
    lock.l_start = 0;
    lock.l_len = 0;
    lock.l_pid = getpid();

    switch (choice)
    {
        case 1:
            // Apply read lock
            lock.l_type = F_RDLCK;

            if (fcntl(fd, F_SETLKW, &lock) == -1)
            {
                perror("Error applying read lock");
            }
            else
            {
                printf("\nRead lock acquired successfully.\n");
                printf("File can be read by the process.\n");
            }
            break;

        case 2:
            // Apply write lock
            lock.l_type = F_WRLCK;

            if (fcntl(fd, F_SETLKW, &lock) == -1)
            {
                perror("Error applying write lock");
            }
            else
            {
                printf("\nWrite lock acquired successfully.\n");

                // Move file pointer to beginning
                lseek(fd, 0, SEEK_SET);

                write(fd, "File locking mechanism in C.\n", 30);

                printf("Data written successfully.\n");
            }
            break;

        case 3:
            // Check lock status
            lock.l_type = F_WRLCK;

            if (fcntl(fd, F_GETLK, &lock) == -1)
            {
                perror("Error checking lock");
            }
            else
            {
                if (lock.l_type == F_UNLCK)
                {
                    printf("\nFile is not locked.\n");
                }
                else if (lock.l_type == F_RDLCK)
                {
                    printf("\nFile has a read lock.\n");
                    printf("Lock held by process ID: %d\n", lock.l_pid);
                }
                else if (lock.l_type == F_WRLCK)
                {
                    printf("\nFile has a write lock.\n");
                    printf("Lock held by process ID: %d\n", lock.l_pid);
                }
            }
            break;

        case 4:
            // Unlock file
            lock.l_type = F_UNLCK;

            if (fcntl(fd, F_SETLK, &lock) == -1)
            {
                perror("Error unlocking file");
            }
            else
            {
                printf("\nFile unlocked successfully.\n");
            }
            break;

        case 5:
            printf("\nExiting program...\n");
            close(fd);
            return 0;

        default:
            printf("\nInvalid choice.\n");
    }

    close(fd);

    return 0;
}