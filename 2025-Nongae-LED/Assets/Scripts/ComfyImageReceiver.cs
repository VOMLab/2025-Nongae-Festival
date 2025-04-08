using UnityEngine;
using System.Collections;
using UnityEngine.Networking;
using UnityEngine.UI;
using System;
using System.Threading.Tasks;
using SocketIOClient;
using SocketIOClient.Newtonsoft.Json;
using Newtonsoft.Json;

[Serializable]
public class ImageResponse {
    public string imageData;
    public string filename;
    public string error;
}


public class ComfyImageReceiver : MonoBehaviour
{
    [SerializeField] private string socketUrl = "http://localhost:3001";
    [SerializeField] private SpriteRenderer spriteRenderer;

    private string lastFilename = "";
    private Texture2D currentTexture;
    private SocketIOClient.SocketIO socket;
    private bool isConnected = false;
    private bool useSocketIO = true;

    void Start() {
        SetupSocketConnection();
    }

    private async void SetupSocketConnection() {
        try {
            Debug.Log("Setting up socket connection...");
            
            socket = new SocketIOClient.SocketIO(socketUrl, new SocketIOClient.SocketIOOptions {
                Transport = SocketIOClient.Transport.TransportType.WebSocket,
            });

            socket.JsonSerializer = new NewtonsoftJsonSerializer();

            socket.OnConnected += (sender, e) => {
                isConnected = true;
            };

            socket.OnDisconnected += (sender, e) => {
                isConnected = false;
            };

            socket.On("unity_result", (data) => {
                try {
                    var json = data.GetValue<string>();
                    ImageResponse res = JsonConvert.DeserializeObject<ImageResponse>(json);

                    UnityMainThreadDispatcher.Instance().Enqueue(() => {
                        ProcessReceivedImage(res);
                    });
                } catch (Exception e) {
                    Debug.LogError("Error processing received image: " + e.Message);
                }
            });

            await socket.ConnectAsync();
        } catch (Exception e) {
            Debug.LogError("Error setting up socket connection: " + e.Message);

            useSocketIO = false;
        }
    }

    private void ProcessReceivedImage(ImageResponse res) {
        lastFilename = response.filename;
        Debug.Log("New image received: " + response.filename);

        string base64Data = response.imageData;

        if(base64Data.Contains(",")) {
            base64Data = base64Data.Substring(base64Data.IndexOf(',') + 1);
        }

        byte[] imageBytes = Convert.FromBase64String(base64Data);

        if(currentTexture != null) {
            Destroy(currentTexture);
        }

        currentTexture = new Texture2D(2, 2);
        bool success = currentTexture.LoadImage(imageBytes);

        if(success) {
            Debug.Log($"Loaded image: {currentTexture.width}x{currentTexture.height}");
            if(spriteRenderer != null) {
                Sprite newSprite = Sprite.Create(
                    currentTexture,
                    new Rect(0, 0, currentTexture.width, currentTexture.height),
                    new Vector2(0.5f, 0.5f)
                );
                spriteRenderer.sprite = newSprite;
            }
        } else {
            Debug.LogError("Failed to load image data");
        }
    }

    private IEnumerator GetLatestImage() {
        Debug.Log("Getting latest image from server...");

        using (UnityWebRequest www = UnityWebRequest.Get(apiUrl)) {
            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success) {
                try {
                    string jsonResponse = www.downloadHandler.text;
                    ImageResponse response = JsonUtility.FromJson<ImageResponse>(jsonResponse);

                    if(!string.IsNullOrEmpty(response.error)) {
                        Debug.LogError("Error fetching image: " + response.error);
                        yield break;
                    }

                    if (response.filename == lastFilename) {
                        Debug.Log("No new image found");
                        yield break;
                    }

                    lastFilename = response.filename;
                    Debug.Log("New image received: " + response.filename);

                    string base64Data = response.imageData;

                    if(base64Data.Contains(",")) {
                        base64Data = base64Data.Substring(base64Data.IndexOf(',') + 1);
                    }

                    byte[] imageBytes = Convert.FromBase64String(base64Data);

                    if(currentTexture != null) {
                        Destroy(currentTexture);
                    }

                    currentTexture = new Texture2D(2, 2);

                    if(spriteRenderer != null) {
                        Sprite newSprite = Sprite.Create(
                            currentTexture,
                            new Rect(0, 0, currentTexture.width, currentTexture.height),
                            new Vector2(0.5f, 0.5f)
                        );
                        spriteRenderer.sprite = newSprite;
                    }
                } catch (Exception e) {
                    Debug.LogError("Error fetching image: " + e.Message);
                }
            } else {
                Debug.LogError("Failed to fetch image: " + www.error);
            }
        }
    }

    void OnDestroy() {
        if(currentTexture != null) {
            Destroy(currentTexture);
        }
        if(socket != null) {
            socket.Disconnect();
        }
        CancelInvoke();
        StopAllCoroutines();
    }
}
